import { Injectable } from '@angular/core';
import { Track } from './track';
import { Image } from './image';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable({
        providedIn: 'root'
    })
export class TrackService {
    trackobj: Track;
    imageObj: Image;
    id: number;
    tracks: Array<Track>;
    apiKey: String;
    springEndPoint: String;
    trackSubject: BehaviorSubject<any>;
    thirdPartyApi: String;
    thridPartyApi: string;
    errorMsg: string;
    errorStatus: string;
    errorBody: string;
    constructor(private http: HttpClient ) {
        this.thirdPartyApi = 'http://ws.audioscrobbler.com/2.0?method=geo.gettoptracks&country=';
        this.apiKey = '&api_key=3ae92df17c55c4e622cf1ad22e46f87b&format=json';
        this.trackSubject = new BehaviorSubject([]);
        this.springEndPoint = 'http://localhost:8082/api/v1';
    }
    getTrackService(country: String): BehaviorSubject<Array<Track>> {

        console.log('Country in service', country);
        const url = `${this.thirdPartyApi}` + `${country}${this.apiKey}`;
        console.log('url', url);
        this.tracks = [];
        this.http.get(url).subscribe(track => {
        const data = track['tracks']['track'];
        this.id = 0;
        data.forEach(targetData => {
        this.id++;
        this.trackobj = new Track();
        this.imageObj = new Image();
        this.imageObj.text = targetData['image'][2]['#text'];
        this.imageObj.size = targetData['image'][2]['size'];
        this.trackobj = targetData;
        this.trackobj.trackId = country.slice(0, 3) + this.id;
        this.tracks.push(this.trackobj);
      });
      this.trackSubject.next(this.tracks);
    });
   return this.trackSubject;
   // return this.http.get(`${this.thirdPartyApi}${country}${this.apiKey}`);
    }
    addTracktoWishList(track: Track) {
        return this.http
        .post(this.springEndPoint + '/track', track, { observe: 'response' })
        .pipe(catchError(this.handleError));
      }
      private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
          console.log('An error occured :', error.error.message);
        } else {
          this.errorStatus = `${error.status}`;
          console.log('Errormsg', this.errorStatus);
          this.errorBody = `${error.error}`;
          console.log(
            `Backened returned code ${error.status},` + `body was :${error.error}`
          );
        }
        return throwError(this.errorStatus);
      }
      getAllWishListTrack1(): BehaviorSubject<Array<Track>> {
        this.tracks = [];
        this.http.get<Track[]>(this.springEndPoint + 'tracks').subscribe(data => {
          console.log('data in service', data);
          this.tracks = data;
          this.trackSubject.next(this.tracks);
        });
        return this.trackSubject;
      }
      deleteTrackFromWishList(track): BehaviorSubject<Array<Track>> {
        const id = track.trackId;
        console.log('id in service', id);
        const url = this.springEndPoint + 'track/' + `${id}`;
        this.http.delete(url, { responseType: 'text' }).subscribe(data => {});
        const index = this.tracks.indexOf(track);
        this.tracks.splice(index, 1);
        this.trackSubject.next(this.tracks);
        return this.trackSubject;
      }
      updateComments(track) {
        const id = track.trackId;
        const com = track.comments;
        console.log('service comments', com);
        const url = this.springEndPoint + 'track/' + `${id}`;
        return this.http.put(url, track, { observe: 'response' });
      }
}
