import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
import { SearchResultsComponent } from './components/search-results/search-results.component'; 

const routes: Routes = [

  { path: '', component: MusicPlayerComponent, pathMatch: 'full' }, 


  { path: 'search/:query', component: SearchResultsComponent },

  
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }