import {Action, State, StateContext} from '@ngxs/store';
import {ClearProfile, IAppState, InitProfile, IProfile, UpdateProfile} from './app.actions';
import {Injectable} from '@angular/core';

const defaults = { profile: null };
type Ctx = StateContext<IAppState>;

// ---- REDUCER -------------------------------------------------------------
@State<IAppState>({ name: 'app', defaults })
@Injectable() export class AppState {
  constructor() { }

  @Action(ClearProfile) clearProfile(ctx: Ctx) { return ctx.setState(defaults); }

  @Action(InitProfile) initProfile(ctx: Ctx, action: InitProfile) {
    ctx.setState({ profile: action.profile });
  }

  @Action(UpdateProfile) updateProfile(ctx: Ctx, action: UpdateProfile) {
    const profile = ctx.getState().profile.dCopy() as IProfile;
    profile.username = action.profile.username;
    ctx.patchState({ profile });
  }

}
