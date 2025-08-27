import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Register } from './components/register/register';
import { AuthGuard } from './auth/guard/auth-guard';
import { ViewArtists } from './components/artist/view-artist/view-artist';
import { CreateArtist } from './components/artist/create-artist/create-artist';
import { SubscriptionsComponent } from './components/subscriptions/subscriptions/subscriptions';
import { ViewMusicContent } from './components/music-content/view-music-content/view-music-content';
import { CreateMusicContent } from './components/music-content/create-music-content/create-music-content';
import { UpdateMusicContent } from './components/music-content/update-music-content/update-music-content';

// export const routes: Routes = [
//     {
//         path: '',
//         component: Login,
//         title: 'Login'
//     },
//     {
//         path: 'dashboard',
//         component: Dashboard,
//         title: 'Dashboard',
//         canActivate: [AuthGuard],
//         // data: { role: 'user' }
//     },
//     {
//         path: 'register',
//         component: Register,
//         title: 'Register'
//     },
//     {
//         path: 'artists',
//         component: ViewArtists,
//         title: 'Artists',
//         canActivate: [AuthGuard],
//     },
//     {
//         path: 'artists/create',
//         component: CreateArtist,
//         title: 'Create Artist',
//         canActivate: [AuthGuard],
//         data: { role: 'admin' }
//     },
//     {
//         path: '**',
//         redirectTo: '',
//         pathMatch: 'full'
//     }
// ];

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard],
    children: [
      { path: 'view-artists', component: ViewArtists, canActivate: [AuthGuard], data: { role: 'admin' } },
      { path: 'create-artist', component: CreateArtist, canActivate: [AuthGuard], data: { role: 'admin' } },
      { path: 'music-content', component: ViewMusicContent, canActivate: [AuthGuard]},
      { path: 'music-content/create', component: CreateMusicContent, canActivate: [AuthGuard], data: {role: 'admin'}},
      { path: 'music-content/update/:contentId', component: UpdateMusicContent, canActivate: [AuthGuard], data: {role: 'admin'}}
      // { path: '', redirectTo: 'view-artists', pathMatch: 'full' } // Default dashboard route
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' } // Wildcard route
];
