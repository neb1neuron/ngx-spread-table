import { Component, Input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-modal',
  templateUrl: './custom-modal.component.html',
  styleUrls: ['./custom-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,]
})
export class CustomModalComponent implements OnInit {

  @Input() headerText = "";
  @Input() bodyText = "";
  @Input() okButtonText = "";
  @Input() cancelButtonText = "";
  @Input() value = "";

  constructor() { }

  ngOnInit() {
    this.input.setValue(this.value);
  }

  input = new FormControl(this.value, [Validators.required]);

  getValue() {
    return this.input.value;
  }
}
