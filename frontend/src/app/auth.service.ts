import { Injectable } from "@angular/core";
import {HttpClient} from "@angular/common/http";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";
import { User } from "./model";

@Injectable()
export class AuthService {

    private token = ''
    constructor(private http: HttpClient, private router: Router){}

    login(username, password): Promise<boolean> {
        //write call to the backend
        
        return  this.http.post<any>('/login', {username, password}, {observe:'response'})
                .toPromise()
                .then(resp => {
                    if (resp.status == 200){
                        this.token = resp.body.token
                        this.router.navigate(['/map'])
                    }
                    console.log('resp :', resp)
                    return true
                })
                .catch(err =>{
                    if(err.status == 401){
                        
                    }
                    console.log('err :', err)
                    return false
                })
        
    }

    signUp(user: User){
       return  this.http.post('/register', user, {observe:'response'})
                    .toPromise()
                        
    }
    

    isLogin() {
        return this.token != ''
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot){
        if (this.isLogin()){
            return true
        } 

        return this.router.parseUrl('/main')

       
    }
}