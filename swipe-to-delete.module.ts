import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwipeToDeleteComponent } from './swipe-to-delete.component';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [SwipeToDeleteComponent],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports: [SwipeToDeleteComponent]
})
export class SwipeToDeleteModule { }
