import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Camera, CameraResultType } from '@capacitor/camera';

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
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'compressor-app';
  photo: string | undefined;
  photoFilename: string | undefined;
  photoSize: number | undefined;
  presentationStatus: 'compressing' | 'original' | 'compressed1' | 'compressed2' | 'compressed3' = 'original';
  compressionCompleted: boolean = false;

  async takePicture() {
    this.compressionCompleted = false;
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl
    });    
    console.log(image);
    this.photo = image.dataUrl;
    this.photoSize = image.dataUrl ? Math.round((image.dataUrl.length * (3/4)) / 1024) : 0;
  }

  async compressPicture() {
    this.presentationStatus = 'compressing';
    this.compressionCompleted = false;
    setTimeout(() => {
      this.presentationStatus = 'original';    
      this.compressionCompleted = true;
    }, 1000);
  }

  selectImage(type: string) {
    switch (type) {
      case 'original':
        this.presentationStatus = 'original';
        break;
      case 'compress1':
        this.presentationStatus = 'compressed1';
        break;
      case 'compress2':
        this.presentationStatus = 'compressed2';
        break;
      case 'compress3':
        this.presentationStatus = 'compressed3';
        break;
      default:
        break;
    }
  }
}