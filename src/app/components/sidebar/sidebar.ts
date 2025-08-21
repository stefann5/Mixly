import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../auth/service/auth-service';
import { map, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [ButtonModule, RouterModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  public user: User | null = null;

  constructor(private authService: AuthService) {

  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(
      {
        next: (currentUser) => {
          this.user = currentUser;
        }
      }
    );
  }

  logout():void{
    this.authService.logout();
  }

}
