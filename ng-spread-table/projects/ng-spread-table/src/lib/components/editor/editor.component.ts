import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IEditor, IEditorComponent, IEditorParams } from '../../models/editor.models';
import { DefaultEditorComponent } from '../default-editor/default-editor.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  standalone: true
})
export class EditorComponent implements OnInit, IEditor {

  @Input() editorParams: IEditorParams | undefined;

  @Output() setValue = new EventEmitter<any>();

  input = new FormControl('');
  defaultEditor = DefaultEditorComponent;

  constructor() { }

  getValue() {
    throw new Error('Method not implemented.');
  }


  @ViewChild('editor', { static: true, read: ViewContainerRef }) editorContainer!: ViewContainerRef;
  // @ViewChild(EditorDirective, { static: true }) editorContainer!: EditorDirective;

  ngOnInit() {
    this.input.setValue(this.editorParams?.value);
    const viewContainerRef = this.editorContainer;
    viewContainerRef.clear();

    if (this.editorParams) {
      const componentRef = viewContainerRef.createComponent<IEditorComponent>(this.editorParams.editorComponent ? this.editorParams.editorComponent : this.defaultEditor);
      this.editorParams.input = this.input;
      componentRef.instance.stInit(this.editorParams);
      componentRef.instance.setValue = this.setValue;
    }
  }
}
