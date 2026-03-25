import { Routes } from '@angular/router';

import { HomePageComponent } from './home-page/home-page.component';
import { WorkPageComponent } from './work-page/work-page.component';
import { CompanyPageComponent } from './company-page/company-page.component';
import { AtomAiPageComponent } from './atom-ai-page/atom-ai-page.component';
import { ContactPageComponent } from './contact-page/contact-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'work', component: WorkPageComponent },
  { path: 'company', component: CompanyPageComponent },
  { path: 'atom-ai', component: AtomAiPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: '**', redirectTo: '' }
];
