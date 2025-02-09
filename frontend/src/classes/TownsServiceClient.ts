import axios, { AxiosInstance, AxiosResponse } from 'axios';
import assert from 'assert';
import { ServerPlayer } from './Player';

export type NeighborStatus = { status: 'unknown' | 'requestSent' | 'requestReceived' | 'neighbor' };

// Represents a user
export type AUser = {_id: string, relationship: NeighborStatus, username: string}
/**
 * The format of a request to join a Town in Covey.Town, as dispatched by the server middleware
 */
export interface TownJoinRequest {
  /** userName of the player that would like to join * */
  userName: string;
  /** ID of the town that the player would like to join * */
  coveyTownID: string;
}

/**
 * The format of a response to join a Town in Covey.Town, as returned by the handler to the server
 * middleware
 */
export interface TownJoinResponse {
  /** Unique ID that represents this player * */
  coveyUserID: string;
  /** Secret token that this player should use to authenticate
   * in future requests to this service * */
  coveySessionToken: string;
  /** Secret token that this player should use to authenticate
   * in future requests to the video service * */
  providerVideoToken: string;
  /** List of players currently in this town * */
  currentPlayers: ServerPlayer[];
  /** Friendly name of this town * */
  friendlyName: string;
  /** Is this a private town? * */
  isPubliclyListed: boolean;
  /** Log in info for user * */
  loggedInID: {_id: string, username: string};
}

/**
 * Payload sent by client to create a Town in Covey.Town
 */
export interface TownCreateRequest {
  friendlyName: string;
  isPubliclyListed: boolean;
}

/**
 * Response from the server for a Town create request
 */
export interface TownCreateResponse {
  coveyTownID: string;
  coveyTownPassword: string;
}

/**
 * Response from the server for a Town list request
 */
export interface TownListResponse {
  towns: CoveyTownInfo[];
}

/**
 * Payload sent by the client to delete a Town
 */
export interface TownDeleteRequest {
  coveyTownID: string;
  coveyTownPassword: string;
}

/**
 * Payload sent by the client to update a Town.
 * N.B., JavaScript is terrible, so:
 * if(!isPubliclyListed) -> evaluates to true if the value is false OR undefined, use ===
 */
export interface TownUpdateRequest {
  coveyTownID: string;
  coveyTownPassword: string;
  friendlyName?: string;
  isPubliclyListed?: boolean;
}

/**
 * Envelope that wraps any response from the server
 */
export interface ResponseEnvelope<T> {
  isOK: boolean;
  message?: string;
  response?: T;
}

export type CoveyTownInfo = {
  friendlyName: string;
  coveyTownID: string;
  currentOccupancy: number;
  maximumOccupancy: number
};

export interface AccountCreateRequest {
  username: string,
  password: string,
}

export interface AccountCreateResponse {
  _id: string,
  username: string,
}


export interface LoginRequest {
  username: string,
  password: string,
}

export interface LoginResponse {
  _id: string,
  username: string,
}

export interface SearchUsersRequest {
  userIdSearching: string,
  username: string,
}

export interface SearchUsersResponse {
  users: AUser[]
}

export interface AddNeighborRequest {
  currentUserId: string,
  UserIdToRequest: string,
}

export interface AddNeighborResponse {
  status: NeighborStatus | string,
}

export interface ListRequestsResponse {
  users: {
    _id: string,
    username: string,
  }[]
}


export interface ListNeighborsResponse {
  users: {
    _id: string,
    username: string,
    isOnline: boolean,
    coveyTownID?: string,
  }[]
}


export interface AcceptNeighborRequestRequest {
  userAccepting: string,
  userSent: string,
}

export interface RemoveNeighborRequestRequest {
  currentUser: string,
  requestedUser: string,
}

export interface RemoveNeighborMappingRequest {
  currentUser: string,
  neighbor: string,
}


export default class TownsServiceClient {
  private _axios: AxiosInstance;

  /**
   * Construct a new Towns Service API client. Specify a serviceURL for testing, or otherwise
   * defaults to the URL at the environmental variable REACT_APP_ROOMS_SERVICE_URL
   * @param serviceURL
   */
  constructor(serviceURL?: string) {
    const baseURL = serviceURL || process.env.REACT_APP_TOWNS_SERVICE_URL;
    assert(baseURL);
    this._axios = axios.create({ baseURL });
  }

  static unwrapOrThrowError<T>(response: AxiosResponse<ResponseEnvelope<T>>, ignoreResponse = false): T {
    if (response.data.isOK) {
      if (ignoreResponse) {
        return {} as T;
      }
      assert(response.data.response);
      return response.data.response;
    }
    throw new Error(`Error processing request: ${response.data.message}`);
  }

  async createTown(requestData: TownCreateRequest): Promise<TownCreateResponse> {
    const responseWrapper = await this._axios.post<ResponseEnvelope<TownCreateResponse>>('/towns', requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async updateTown(requestData: TownUpdateRequest): Promise<void> {
    const responseWrapper = await this._axios.patch<ResponseEnvelope<void>>(`/towns/${requestData.coveyTownID}`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  async deleteTown(requestData: TownDeleteRequest): Promise<void> {
    const responseWrapper = await this._axios.delete<ResponseEnvelope<void>>(`/towns/${requestData.coveyTownID}/${requestData.coveyTownPassword}`);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  async listTowns(): Promise<TownListResponse> {
    const responseWrapper = await this._axios.get<ResponseEnvelope<TownListResponse>>('/towns');
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async joinTown(requestData: TownJoinRequest): Promise<TownJoinResponse> {
    const responseWrapper = await this._axios.post('/sessions', requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async createAccount(requestData: AccountCreateRequest): Promise<AccountCreateResponse> {
    const responseWrapper = await this._axios.post('/signup', requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async loginToAccount(requestData: LoginRequest): Promise<LoginResponse> {
    const responseWrapper = await this._axios.post('/login', requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async searchForUsersByUsername(requestData: SearchUsersRequest): Promise<SearchUsersResponse> {
    const responseWrapper = await this._axios.get<ResponseEnvelope<SearchUsersResponse>>(`/users/${requestData.userIdSearching}/${requestData.username}`);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async sendAddNeighborRequest(requestData: AddNeighborRequest): Promise<AddNeighborResponse> {
    const responseWrapper = await this._axios.post<ResponseEnvelope<AddNeighborResponse>>(`/users/request_neighbor`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async acceptRequestHandler(requestData: AcceptNeighborRequestRequest): Promise<NeighborStatus> {
    const responseWrapper = await this._axios.put<ResponseEnvelope<NeighborStatus>>(`/users/accept_neighbor_request`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async removeNeighborRequestHandler(requestData: RemoveNeighborRequestRequest): Promise<NeighborStatus> {
    const responseWrapper = await this._axios.delete<ResponseEnvelope<NeighborStatus>>(`/users/remove_neighbor_request/${requestData.currentUser}/${requestData.requestedUser}`);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async removeNeighborMappingHandler(requestData: RemoveNeighborMappingRequest): Promise<NeighborStatus> {
    const responseWrapper = await this._axios.delete<ResponseEnvelope<NeighborStatus>>(`/users/remove_neighbor_mapping/${requestData.currentUser}/${requestData.neighbor}`);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async listNeighbors(currentUser: string): Promise<ListNeighborsResponse> {
    const responseWrapper = await this._axios.get<ResponseEnvelope<ListNeighborsResponse>>(`/neighbors/${currentUser}`);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async listNeighborRequestsReceived(currentUser: string): Promise<ListRequestsResponse> {
    const responseWrapper = await this._axios.get<ResponseEnvelope<ListRequestsResponse>>(`/requests_received/${currentUser}`);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async listNeighborRequestsSent(currentUser: string): Promise<ListRequestsResponse> {
    const responseWrapper = await this._axios.get<ResponseEnvelope<ListRequestsResponse>>(`/requests_sent/${currentUser}`);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }
}
