import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  auth0Id: string;
  constructor(private readonly http: HttpClient) {}

  sendFriendRequest(receiverId: string): Observable<void> {
    return this.http.post<void>(
      `${environment.serverUrl}/friends/send/${this.auth0Id}/${receiverId}`,
      {}
    );
  }

  acceptFriendRequest(requestId: string): Observable<void> {
    return this.http.post<void>(
      `${environment.serverUrl}/friends/accept/${requestId}`,
      {}
    );
  }

  rejectFriendRequest(requestId: string): Observable<void> {
    return this.http.post<void>(
      `${environment.serverUrl}/friends/reject/${requestId}`,
      {}
    );
  }

  removeFriend(friendId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.serverUrl}/friends/remove/${this.auth0Id}/${friendId}`
    );
  }

  blockNormalUser(blockedUserId: string): Observable<void> {
    return this.http.post<void>(
      `${environment.serverUrl}/friends/block/${this.auth0Id}/${blockedUserId}`,
      {}
    );
  }

  blockFriend(blockedFriendId: string): Observable<void>{
    return this.http.post<void>(
      `${environment.serverUrl}/friends/blockFriend/${this.auth0Id}/${blockedFriendId}`,
      {}
    );
  }

  blockUserWithPendingRequest(otherUserId: string): Observable<void> {
    return this.http.post<void>(
      `${environment.serverUrl}/friends/blockUserWithPendingRequest/${this.auth0Id}/${otherUserId}`,
      {}
    );
  }
}
