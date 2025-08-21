import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Register } from './components/register/register';
import { AuthGuard } from './auth/guard/auth-guard';
import { ViewArtists } from './components/artist/view-artist/view-artist';
import { CreateArtist } from './components/artist/create-artist/create-artist';

export const routes: Routes = [
    {
        path: '',
        component: Login,
        title: 'Login'
    },
    {
        path: 'dashboard',
        component: Dashboard,
        title: 'Dashboard',
        canActivate: [AuthGuard],
        // data: { role: 'user' }
    },
    {
        path: 'register',
        component: Register,
        title: 'Register'
    },
    {
        path: 'artists',
        component: ViewArtists,
        title: 'Artists',
        canActivate: [AuthGuard],
    },
    {
        path: 'artists/create',
        component: CreateArtist,
        title: 'Create Artist',
        canActivate: [AuthGuard],
        // data: { role: 'admin' } // Uncomment if you want route-level admin check
    },
    // Redirect any unknown routes to login
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];