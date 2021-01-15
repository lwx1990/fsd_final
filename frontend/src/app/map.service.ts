import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";



@Injectable()
export class MapService {
    constructor(private http: HttpClient){}
 
    async getUser(){
        return await this.http.get<any>('/consumer').toPromise()
    }

    async getLocation() {
        return this.http.get<any>('/location')
        .toPromise()
    }

}