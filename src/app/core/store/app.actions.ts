// ---- MODEL -------------------------------------------------------------
export interface IAppState {
  profile: IProfile;
}

export interface IProfile {
  username: string;
}

// ---- ACTIONS -------------------------------------------------------------
export class InitProfile   { static readonly type = '[APP] Init Profile';   constructor(public profile: IProfile) {} }
export class UpdateProfile { static readonly type = '[APP] Update Profile'; constructor(public profile: Partial<IProfile>) {} }
export class ClearProfile  { static readonly type = '[APP] Clear Profile'; }
