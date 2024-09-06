import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Camera, CameraResultType } from '@capacitor/camera';
import { NgxImageCompressService } from 'ngx-image-compress';
import imageCompression from 'browser-image-compression';
import { max } from 'rxjs';

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
  photoFilename: string | undefined;
  photoSize: number | undefined;
  presentationStatus: 'compressing' | 'original' | 'compress1' | 'compress2' | 'compress3' = 'original';
  compressionCompleted: boolean = false;

  constructor(
    private imageCompress: NgxImageCompressService
  ) {}

  async takePicture() {
    this.compressionCompleted = false;
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl
    });    
    this.originalPhoto = image.dataUrl;
    this.selectImage('original');
  }

  async compressPicture() {
    if (!this.photo) return;
    this.presentationStatus = 'compressing';
    this.compressionCompleted = false;
    await this.compressWithNgxImageCompress();
    await this.compressWithBrowserImageCompression();
    this.compressionCompleted = true;
    this.selectImage('compress1');
  }

  async compressWithNgxImageCompress() {
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
  }

  async compressWithBrowserImageCompression() {
    if (!this.photo) return;

    const options = {
      maxSizeMB: 0.5, // (500KB)
      maxWidthOrHeight: 720,
      useWebWorker: true,
      alwaysKeepResolution: true,
      maxIteration: 5,
      initialQUality: 0.8
    };

    try {
      const blob = await fetch(this.photo).then(res => res.blob());
      const file = new File([blob], 'compressed_image.png', { type: 'image/png', lastModified: Date.now() });
      const compressedBlob = await imageCompression(file, options);
      const compressedImage = await this.blobToDataURL(compressedBlob);

      this.browserImageCompressPhoto = compressedImage;
    } catch (error) {
      console.error('Error during browser image compression:', error);
    }
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
        this.photo = this.browserImageCompressPhoto;
        this.photoFilename = 'resultado-browser-image-compression.png';
        this.presentationStatus = 'compress3';
        break;
      default:
        break;
    }
    this.photoSize = this.photo ? Math.round((this.photo.length * (3/4)) / 1024) : 0;
  }
}