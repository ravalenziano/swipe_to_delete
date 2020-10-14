import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, Input, ViewEncapsulation } from '@angular/core';
import { fromEvent, Subscription, timer } from 'rxjs';

export interface thresholdExceededEvent {
  isExceeded: boolean,
  isMouseUp: boolean,
  id: any
}

export enum SwipeDirection {
  None,
  Left,
  Right
}

@Component({
  selector: 'app-swipe-to-delete',
  templateUrl: './swipe-to-delete.component.html',
  styleUrls: ['./swipe-to-delete.component.css']
})
export class SwipeToDeleteComponent implements OnInit {


  swipeDirection: SwipeDirection = SwipeDirection.None;

  handleMouseDown: EventListener;
  handleMouseUp: EventListener;
  handleMouseMove: EventListener;

  handleTouchStart: EventListener;
  handleTouchEnd: EventListener;
  handleTouchMove: EventListener;

  activeTouch: Touch;

  subMouseUp: Subscription;
  subTimer: Subscription;
  subMouseMove: Subscription;

  subTouchStart: Subscription;
  subTouchEnd: Subscription;
  subTouchMove: Subscription;
  subTouchTimer: Subscription;

  @ViewChild('swipeContainer') swipeContainer: ElementRef;

  thresholdExceeded: boolean = false;
  @Output() thresholdExceededMoveEvent: EventEmitter<thresholdExceededEvent> = new EventEmitter<thresholdExceededEvent>();

  @Input() id: any;
  @Input() scrollLeftDisabled?: boolean;
  @Input() scrollRightDisabled?: boolean;


  scrollLeftActive: boolean;
  scrollRightActive: boolean;

  @ViewChild('swipeContentContainer') contentContainer : ElementRef; 
  @ViewChild('swipeMasterContainer') swipeMasterContainer: ElementRef; 

  options: {
    threshold: number,
    delay: number,

  }

  dragData: {
    startPageX: number,
  }

  constructor() { }

  get SwipeDirection() { return SwipeDirection; }

  dragEnd(pageX: number) {
    let diff = this.dragData.startPageX - pageX;

    this.thresholdExceededMoveEvent.emit({
      isExceeded: this.thresholdExceeded,
      isMouseUp: true,
      id: this.id
    });

    if (this.thresholdExceeded) {
      if (diff > 0) {
        this.contentContainer.nativeElement.classList.add("swipeDelete");
      } else {
        this.contentContainer.nativeElement.classList.add("swipeDelete--left");
      }
     

    } else {
      this.contentContainer.nativeElement.style.right = 0;
    }

    this.contentContainer.nativeElement.classList.add("swipeTransition");

    this.thresholdExceeded = false;
  }

  updateActiveEvent(event: TouchEvent) : boolean {
    if (this.activeTouch == null) {
      return false;
    }

    let hasActiveTouch = false;
    for (var i = 0; i < event.changedTouches.length; i++) {
      if (event.changedTouches[i].identifier == this.activeTouch.identifier) {
        hasActiveTouch = true;

        let diff = this.dragData.startPageX - event.changedTouches[i].pageX;

        if (diff > 0 && this.scrollLeftActive ||
          diff < 0 && this.scrollRightActive) {
             this.activeTouch = event.changedTouches[i];
        }

        break;
      }
    }

    if (!hasActiveTouch) {
      return;
    }

  }

  dragMove(pageX: number) {
    let diff = this.dragData.startPageX - pageX;

    if (diff > 0) {
      this.swipeDirection = SwipeDirection.Left;
    } else {
      this.swipeDirection = SwipeDirection.Right;
    }

    this.contentContainer.nativeElement.style.right = diff + 'px';
    let containerWidth = this.swipeMasterContainer.nativeElement.clientWidth;
      if (Math.abs(diff) / containerWidth * 100 >= this.options.threshold) {
        if (!this.thresholdExceeded) {

          this.thresholdExceeded = true;
          this.thresholdExceededMoveEvent.emit({
            isExceeded: this.thresholdExceeded,
            isMouseUp: false,
            id: this.id
          });
        }
      } else {
        if (this.thresholdExceeded) {
          this.thresholdExceeded = false;
          this.thresholdExceededMoveEvent.emit({
            isExceeded: this.thresholdExceeded,
            isMouseUp: false,
            id: this.id
          });
        }

      }
  }

  ngOnInit(): void {
    this.dragData = {
      startPageX: 0
    }

    this.options = {
      threshold: 50,
      delay: 0
    };

  

    this.handleMouseDown = (event: MouseEvent) => {


      this.contentContainer.nativeElement.classList.remove("swipeTransition");
      this.dragData.startPageX = event.pageX;

      this.subTimer = timer(this.options.delay).subscribe(x => {
        this.subTimer.unsubscribe();
        this.subMouseMove.unsubscribe();
        this.subMouseUp.unsubscribe();
        let eventUp = fromEvent(document, 'mouseup');
        this.subMouseUp = eventUp.subscribe(this.handleMouseUp);

        let eventMove = fromEvent(document, 'mousemove');
        this.subMouseMove = eventMove.subscribe(this.handleMouseMove);

        
      });

      this.subMouseUp = fromEvent(document, 'mouseup').subscribe((event: MouseEvent) => {

        this.subTimer.unsubscribe();
        this.subMouseMove.unsubscribe();
        this.subMouseUp.unsubscribe();
     
      });

      this.subMouseMove = fromEvent(document, 'mousemove').subscribe((event: MouseEvent) => {
        let diff = Math.abs(this.dragData.startPageX - event.pageX);
        if (diff > 5) {
          this.subTimer.unsubscribe();
          this.subMouseMove.unsubscribe();
          this.subMouseUp.unsubscribe();
        }
      });
    }

   

    this.handleMouseUp = (event: MouseEvent) => {
      this.subMouseUp.unsubscribe();
      this.subMouseMove.unsubscribe();
      this.dragEnd(event.pageX);
    }

    this.handleMouseMove = (event: MouseEvent) => {
      this.dragMove(event.pageX);
    }

    this.handleTouchStart = (event: TouchEvent) => {

      if (this.activeTouch != null) {
        return;
      }

      if (!this.scrollLeftDisabled) {
        this.scrollLeftActive = true;
      } else {
        this.scrollLeftActive = false;
      }

      if (!this.scrollRightDisabled) {
        this.scrollRightActive = true;
      } else {
        this.scrollRightActive = false;
      }

      this.activeTouch = event.touches[0];

      this.dragData.startPageX = this.activeTouch.pageX;

      this.contentContainer.nativeElement.classList.remove("swipeTransition");

      this.subTouchTimer = timer(this.options.delay).subscribe(x => {
        this.subTouchTimer.unsubscribe();
        this.subTouchMove.unsubscribe();
        this.subTouchEnd.unsubscribe();

        let eventUp = fromEvent(document, 'touchend');
        this.subTouchEnd = eventUp.subscribe(this.handleTouchEnd);

        let eventMove = fromEvent(document, 'touchmove');
        this.subTouchMove = eventMove.subscribe(this.handleTouchMove);
      });

      this.subTouchEnd = fromEvent(document, 'touchend').subscribe((event: TouchEvent) => {


        if (this.updateActiveEvent(event)) {
          this.subTouchTimer.unsubscribe();
          this.subTouchMove.unsubscribe();
          this.subTouchEnd.unsubscribe();
        }
       

      });

      this.subTouchMove = fromEvent(document, 'touchmove').subscribe((event: TouchEvent) => {
        if (!this.updateActiveEvent(event)) {
          return;
        }
        let diff = Math.abs(this.dragData.startPageX - this.activeTouch.pageX);
        if (diff > 5) {
          this.subTouchTimer.unsubscribe();
          this.subTouchMove.unsubscribe();
          this.subTouchEnd.unsubscribe();
        }
      });
    }

    this.handleTouchMove = (event: TouchEvent) => {
    
      if (this.activeTouch == null) {
        return;
      }
      this.updateActiveEvent(event);
      this.dragMove(this.activeTouch.pageX);
    }

    this.handleTouchEnd = (event: TouchEvent) => {
      if (this.activeTouch == null) {
        return;
      }

      this.updateActiveEvent(event);
      this.subTouchEnd.unsubscribe();
      this.subTouchMove.unsubscribe();
      this.dragEnd(this.activeTouch.pageX);
      this.activeTouch = null;
    }

  }


}
