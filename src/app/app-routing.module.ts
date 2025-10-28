import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MusicPlayerComponent } from './components/music-player/music-player.component';

const routes: Routes = [
  { path: '', component: MusicPlayerComponent },
  { path: '**', redirectTo: '' } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }