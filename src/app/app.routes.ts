import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Register } from './components/register/register';

export const routes: Routes = [
    {
        path: '',
        component: Login,
        title: 'Login'
    },
    {
        path: 'dashboard',
        component: Dashboard,
        title: 'Dashboard'
    },
    {
        path: 'register',
        component: Register,
        title: 'Register'
    },
];
