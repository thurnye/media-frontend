export interface ILogin {
  email: string;
  password: string;
}

export interface ISignUp {
  firstName:   string;
  lastName:    string;
  email:       string;
  password:    string;
  dateOfBirth: string;
}

export interface IUserWorkspace {
  workspaceId: string;
  name:        string;
}

export interface IUser {
  id:         string;
  firstName:  string;
  lastName:   string;
  email:      string;
  workspaces?: IUserWorkspace[];
}
