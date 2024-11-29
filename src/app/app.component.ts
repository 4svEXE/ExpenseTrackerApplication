import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/layout/header/header.component';
import { NavComponent } from './components/layout/nav/nav.component';

const components = [
  HeaderComponent,
  NavComponent
]

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, components],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ExpenseTrackerApplication';
}
