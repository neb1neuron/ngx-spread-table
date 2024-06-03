import { Component, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StDropdownEditorComponent } from './shared/st-dropdown-editor/st-dropdown-editor.component';
import { StCustomRendererComponent } from './shared/st-custom-renderer/st-custom-renderer.component';
import { RequiredValidator } from './shared/custom-validators/required-validator';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { CustomModalComponent } from './shared/custom-modal/custom-modal.component';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { SpreadTableComponent } from 'ngx-spread-table';
import { CommonModule } from '@angular/common';
// import { UndoRedoService } from '../../../ng-spread-table/src/lib/services/undo-redo.service';
// import { SpreadTableComponent } from '../../../ng-spread-table/src/lib/spread-table.component';
// import { Cell, Column, Row } from '../../../ng-spread-table/src/lib/models/cell.model';
// import { ContextMenuModel } from '../../../ng-spread-table/src/lib/models/context-menu.model';
// import { Change } from '../../../../dist/ng-spread-table/lib/services/undo-redo.service';
import { DemoComponent } from './demo/demo.component';
import { DocumentationComponent } from './documentation/documentation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SpreadTableComponent, DemoComponent, DocumentationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ng-spread-table-demo';

  pages = {
    demo: 'demo',
    docs: 'docs',
  }

  selectedPage = this.pages.demo;

  setPage(page: string) {
    this.selectedPage = page;
  }
}
