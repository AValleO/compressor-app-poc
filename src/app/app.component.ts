import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Camera, CameraResultType } from '@capacitor/camera';
import { NgxImageCompressService } from 'ngx-image-compress';
import imageCompression from 'browser-image-compression';
import Compressor from 'compressorjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [NgxImageCompressService]
})
export class AppComponent {
  title = 'compressor-app';
  photo: string | undefined;
  originalPhoto: string | undefined;
  ngxImageCompressPhoto: string | undefined;
  browserImageCompressPhoto: string | undefined;
  compressorJsPhoto: string | undefined;
  photoFilename: string | undefined;
  photoSize: number | undefined;
  originalPhotoSize: number | undefined;
  presentationStatus: 'compressing' | 'original' | 'compress1' | 'compress2' | 'compress3' = 'original';
  compressionCompleted: boolean = false;
  ngxImageCompressTime: number | undefined;
  browserImageCompressTime: number | undefined;
  compressorJsTime: number | undefined;
  ngxImageCompressFinishTime: string | undefined;
  browserImageCompressFinishTime: string | undefined;
  compressorJsFinishTime: string | undefined;
  ngxImageCompressRatio: number | undefined;
  browserImageCompressRatio: number | undefined;
  compressorJsRatio: number | undefined;

  constructor(
    private imageCompress: NgxImageCompressService
  ) {}

  resetAllVariables(){
    this.photo = undefined;
    this.originalPhoto = undefined;
    this.ngxImageCompressPhoto = undefined;
    this.browserImageCompressPhoto = undefined;
    this.compressorJsPhoto = undefined;
    this.photoFilename = undefined;
    this.photoSize = undefined;
    this.originalPhotoSize = undefined;
    this.presentationStatus = 'original';
    this.compressionCompleted = false;
    this.ngxImageCompressTime = undefined;
    this.browserImageCompressTime = undefined;
    this.compressorJsTime = undefined;
    this.ngxImageCompressFinishTime = undefined;
    this.browserImageCompressFinishTime = undefined;
    this.compressorJsFinishTime = undefined;
    this.ngxImageCompressRatio = undefined;
    this.browserImageCompressRatio = undefined;
    this.compressorJsRatio = undefined;
  }

  async takePicture() {
    this.resetAllVariables();
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl
    });    
    this.originalPhoto = image.dataUrl;
    this.originalPhotoSize = image.dataUrl ? Math.round((image.dataUrl.length * (3/4)) / 1024) : 0; // Calculate original photo size in KB
    this.selectImage('original');
  }

  async compressPicture() {
    if (!this.photo) return;
    this.presentationStatus = 'compressing';
    this.compressionCompleted = false;
    await this.compressWithNgxImageCompress();
    await this.compressWithBrowserImageCompression();
    await this.compressWithCompressorJs();
    this.compressionCompleted = true;
    this.selectImage('compress1');
  }

  async compressWithNgxImageCompress() {
    const startTime = performance.now();
    let compressedImage: string | undefined = this.photo;
    let compressedSize = this.photoSize || 0;
    let quality = 50; // Initial quality
    const maxSizeKB = 500;

    while (compressedSize > maxSizeKB && quality > 0) {
      if (compressedImage) {
        compressedImage = await this.imageCompress.compressFile(compressedImage, -1, quality, quality);
        compressedSize = compressedImage ? Math.round((compressedImage.length * (3/4)) / 1024) : 0;
      }
      quality -= 5; // Decrease quality for further compression
    }

    // Ensure the compressed image has a .png extension
    if (compressedImage && !compressedImage.startsWith('data:image/png')) {
      compressedImage = compressedImage.replace(/^data:image\/\w+/, 'data:image/png');
    }
    this.ngxImageCompressPhoto = compressedImage;
    this.photoSize = compressedSize;
    this.photoFilename = 'compressed_image.png';
    const endTime = performance.now();
    this.ngxImageCompressTime = endTime - startTime;
    this.ngxImageCompressFinishTime = new Date().toLocaleTimeString();
    this.ngxImageCompressRatio = this.originalPhotoSize ? compressedSize / this.originalPhotoSize : undefined;
  }

  async compressWithBrowserImageCompression() {
    if (!this.photo) return;

    const startTime = performance.now();
    const options = {
      maxSizeMB: 0.5, // (500KB)
      maxWidthOrHeight: 540,
      useWebWorker: true,
      //alwaysKeepResolution: true,
      maxIteration: 5,
      initialQuality: 0.9
    };

    try {
      const blob = await fetch(this.photo).then(res => res.blob());
      const file = new File([blob], 'compressed_image.png', { type: 'image/png', lastModified: Date.now() });
      const compressedBlob = await imageCompression(file, options);
      const compressedImage = await this.blobToDataURL(compressedBlob);

      this.browserImageCompressPhoto = compressedImage;
      const endTime = performance.now();
      this.browserImageCompressTime = endTime - startTime;
      this.browserImageCompressFinishTime = new Date().toLocaleTimeString();
      const compressedSize = Math.round((compressedImage.length * (3/4)) / 1024);
      this.browserImageCompressRatio = this.originalPhotoSize ? compressedSize / this.originalPhotoSize : undefined;
    } catch (error) {
      console.error('Error during browser image compression:', error);
    }
  }

  async compressWithCompressorJs() {
    if (!this.photo) return;

    const startTime = performance.now();
    const blob = await fetch(this.photo).then(res => res.blob());

    new Compressor(blob, {
      quality: 0.8,
      mimeType: 'image/png',
      maxWidth: 1980,
      maxHeight: 1980,
      convertSize: 500000, // 500KB
      success: async (compressedBlob) => {
        const compressedImage = await this.blobToDataURL(compressedBlob);
        this.compressorJsPhoto = compressedImage;
        const endTime = performance.now();
        this.compressorJsTime = endTime - startTime;
        this.compressorJsFinishTime = new Date().toLocaleTimeString();
        const compressedSize = Math.round((compressedImage.length * (3/4)) / 1024);
        this.compressorJsRatio = this.originalPhotoSize ? compressedSize / this.originalPhotoSize : undefined;
      },
      error: (err) => {
        console.error('Error during Compressor.js compression:', err);
      },
    });
  }

  blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  handleClick(direction: 'left' | 'right') {
    let newPresentationStatus = this.presentationStatus;
    switch (this.presentationStatus) {
      case 'original':
        newPresentationStatus = direction === 'left' ? 'compress3' : 'compress1';
        break;
      case 'compress1':
        newPresentationStatus = direction === 'left' ? 'original' : 'compress2';
        break;
      case 'compress2':
        newPresentationStatus = direction === 'left' ? 'compress1' : 'compress3';
        break;
      case 'compress3':
        newPresentationStatus = direction === 'left' ? 'compress2' : 'original';
        break;
      default:
        break;      
    }
    this.selectImage(newPresentationStatus);
  }

  selectImage(type: string) {
    switch (type) {
      case 'original':
        this.photo = this.originalPhoto;
        this.photoFilename = 'original.png';
        this.presentationStatus = 'original';
        break;
      case 'compress1':
        this.photo = this.ngxImageCompressPhoto;
        this.photoFilename = 'resultado-ngx-image-compress.png';
        this.presentationStatus = 'compress1';
        break;
      case 'compress2':
        this.photo = this.browserImageCompressPhoto;
        this.photoFilename = 'resultado-browser-image-compression.png';
        this.presentationStatus = 'compress2';
        break;
      case 'compress3':
        this.photo = this.compressorJsPhoto;
        this.photoFilename = 'resultado-compressorjs.png';
        this.presentationStatus = 'compress3';
        break;
      default:
        break;
    }
    this.photoSize = this.photo ? Math.round((this.photo.length * (3/4)) / 1024) : 0;
  }
}