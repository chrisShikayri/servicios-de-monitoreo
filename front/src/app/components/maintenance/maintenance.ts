import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance.html',
  styleUrls: ['./maintenance.css']
})
export class MaintenanceComponent implements OnInit {
  maintenances: any[] = [];
  services: any[] = [];
  creating = false;
  newMaintenance: any = {
    serviceId: '',
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    modo: 'pause',
    multiplier: 3,
  };

  @Output() onSaved = new EventEmitter<void>();

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadServices();
    this.load(); // Cargar también mantenimientos en paralelo
  }

  loadServices() {
    this.api.getServices().subscribe((d: any) => {
      // Mostrar sólo servicios activos
      const all = d || [];
      this.services = all.filter((s: any) => s.activo !== false);
      if (this.services.length && !this.newMaintenance.serviceId) {
        this.newMaintenance.serviceId = this.services[0]._id;
      }
      // después de cargar servicios, cargar mantenimientos y mapear nombres
      this.load();
    });
  }

  load() {
    this.api.getMaintenance().subscribe((d: any) => {
      console.log('Mantenimientos recibidos:', d);
      // Mostrar solo mantenimientos activos (ocultar soft-deletes)
      const mains = (d || [])
        .filter((m: any) => m.activo !== false)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.fechaInicio).getTime();
          const dateB = new Date(b.fechaInicio).getTime();
          return dateB - dateA; // Más recientes primero
        })
        .map((m: any) => ({
          ...m,
          serviceName: (this.services && this.services.length > 0) 
            ? (this.services.find((s: any) => s._id === m.serviceId)?.nombre || m.serviceId)
            : m.serviceId
        }));
      console.log('Mantenimientos mapeados:', mains);
      this.maintenances = mains;
    });
  }

  create() {
    if (this.creating) return;
    
    // Validaciones
    if (!this.newMaintenance.serviceId) {
      alert('⚠️ Selecciona un servicio para el mantenimiento');
      return;
    }
    
    if (!this.newMaintenance.titulo) {
      alert('⚠️ El título del mantenimiento es obligatorio');
      return;
    }
    
    if (!this.newMaintenance.fechaInicio) {
      alert('⚠️ La fecha de inicio es obligatoria');
      return;
    }
    
    this.creating = true;
    const body = { ...this.newMaintenance };
    
    this.api.createMaintenance(body).subscribe({
      next: (response: any) => {
        this.creating = false;
        
        // Agregar el nuevo mantenimiento a la lista inmediatamente
        const newMaint = {
          ...response,
          serviceName: this.services.find((s: any) => s._id === response.serviceId)?.nombre || response.serviceId
        };
        this.maintenances = [newMaint, ...this.maintenances];
        
        // Limpiar el formulario
        this.newMaintenance = { 
          serviceId: this.services.length > 0 ? this.services[0]._id : '',
          titulo: '', 
          descripcion: '', 
          fechaInicio: '', 
          fechaFin: '', 
          modo: 'pause', 
          multiplier: 3 
        };
        
        // Emitir evento para que dashboard recargue datos
        this.onSaved.emit();
        
        // Scroll hacia la lista de mantenimientos
        setTimeout(() => {
          const list = document.querySelector('.maintenance-list');
          if (list) {
            list.scrollTop = 0;
          }
        }, 100);
      },
      error: (err) => {
        console.error('Error creando mantenimiento', err);
        this.creating = false;
        alert('❌ Error al crear el mantenimiento. Intenta de nuevo.');
      }
    });
  }

  finish(id: string) {
    this.api.updateMaintenance(id, { estado: 'Finalizado', fechaFin: new Date().toISOString() }).subscribe(() => this.load());
  }

  remove(id: string) {
    if (!confirm('Eliminar mantenimiento?')) return;
    this.api.deleteMaintenance(id).subscribe(() => this.load());
  }
}
