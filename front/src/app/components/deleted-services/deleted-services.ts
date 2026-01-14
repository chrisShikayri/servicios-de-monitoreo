import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-deleted-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deleted-services.html',
  styleUrl: './deleted-services.css'
})
export class DeletedServicesComponent implements OnInit {
  deletedServices: any[] = [];
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getDeletedServices().subscribe(list => {
      this.deletedServices = list || [];
      this.loading = false;
    }, err => {
      console.error('Error cargando servicios eliminados', err);
      this.deletedServices = [];
      this.loading = false;
    });
  }

  restore(id: string) {
    if (!confirm('Restaurar este servicio?')) return;
    this.api.restoreService(id).subscribe(() => {
      this.load();
      try { window.alert('Servicio restaurado'); } catch(e) {}
    }, err => { console.error('Error restaurando', err); alert('Error restaurando'); });
  }

  hardDelete(id: string) {
    if (!confirm('Eliminar definitivamente? Esta acción no se puede deshacer.')) return;
    this.api.deleteServiceHard(id).subscribe(() => {
      this.load();
      try { window.alert('Servicio eliminado definitivamente'); } catch(e) {}
    }, err => { console.error('Error borrando definitivamente', err); alert('Error borrando'); });
  }
}
