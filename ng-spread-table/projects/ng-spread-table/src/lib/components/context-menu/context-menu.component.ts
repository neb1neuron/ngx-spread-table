import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContextMenuModel } from '../../models/context-menu.model';
import { CommonModule } from '@angular/common';
import { BypassHtmlSanitizerPipe } from '../../services/sanitizer.pipe'

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss'],
  standalone: true,
  imports: [CommonModule, BypassHtmlSanitizerPipe]
})
export class ContextMenuComponent {

  @Input() contextMenuItems: ContextMenuModel[] = [];

  @Output() onContextMenuItemClick: EventEmitter<any> = new EventEmitter<any>();

  onContextMenuClick(event: any, menuItem: ContextMenuModel): any {
    if (!menuItem.disabled) {
      this.onContextMenuItemClick.emit({
        event: event,
        menuEvent: menuItem.menuEvent
      });
    }
  }

}
