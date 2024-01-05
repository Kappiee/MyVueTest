import { SortableEvent } from './sortable';
export interface CustomSortableEvent extends SortableEvent {
    originalEvent: any;
    // originalEvent: MouseEvent;
  }