import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { StyleguideComponent } from './styleguide.component';

const routes: Routes = [
  { path: '', component: StyleguideComponent, data: { title: 'W3Booster Styleguide' } }
];

@NgModule({
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
  declarations: [StyleguideComponent]
})
export class StyleguideModule {}
