import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
// Importaremos SearchResultsComponent más adelante

const routes: Routes = [
  { path: '', component: MusicPlayerComponent },
  // <-- CAMBIO: Añade la ruta de búsqueda
  { path: '**', redirectTo: '' } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }