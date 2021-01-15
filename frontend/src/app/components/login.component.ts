import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {


  errorMessage = ''
  form: FormGroup
  submitted = false

  constructor(private fb: FormBuilder, private authSvc: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      username: this.fb.control('', [Validators.required]),
      password: this.fb.control('', [Validators.required])
    })
  }

  login(){

    let username = this.form.get('username').value
    let password = this.form.get('password').value


    this.authSvc.login(username, password)
      .then(result => {
        console.log('result:', result)
        if(result == false){
          this.errorMessage = "Incorrect username or password"
        }
      })
      .catch(err => {
        
        console.log('err', err)
      })
    
  }

}
