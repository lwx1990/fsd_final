import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from '../model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})


export class RegisterComponent implements OnInit {


  registerForm: FormGroup
 
  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private authSvc: AuthService) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
        firstname: this.fb.control('', [Validators.required]),
        lastname: this.fb.control('',[Validators.required]),
        email: this.fb.control('',[Validators.required, Validators.email]),
        username: this.fb.control('',[Validators.required]),
        password: this.fb.control('',([Validators.required]))

    })
  }


  register(){
    let user: User = {
      username: this.registerForm.get('username').value,
      password: this.registerForm.get('password').value,
      email: this.registerForm.get('email').value,
      firstname: this.registerForm.get('firstname').value,
      lastname: this.registerForm.get('lastname').value
    }

    this.authSvc.signUp(user)
        .then((result)=>{ 
              console.log('>>result:',result)
              if(result.status == 200){
                   this.registerForm.reset()
                  this.router.navigate(['/login'])
              } 
      }).catch((error)=>{
          console.log('err',error);
      });   
  }

}
