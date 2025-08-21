import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Sidebar } from "../sidebar/sidebar";


@Component({
  selector: 'app-dashboard',
  imports: [ButtonModule, RouterOutlet, CommonModule, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  constructor(
    private router: Router
  ) { }

  navigateToArtists(): void {
    this.router.navigate(['dashboard/create-artist']);
  }
}
