drop database accounting;
create database accounting;
use accounting;

create table config (jsondata JSON);

create table workspace ( 
     id INTEGER NOT NULL AUTO_INCREMENT,
     name TEXT NOT NULL,
     description TEXT,
     PRIMARY KEY (id)
);

create index workspaceindex on workspace (name(15));

create table user (
    id INTEGER NOT NULL AUTO_INCREMENT,
    firstname TEXT,
    lastname TEXT,
    useridemail TEXT,
    passwrd TEXT default null,
    lastaccessdate datetime default null,
    accesstokentries INTEGER default 0,
    accesstoken INTEGER default 0,
    accesskey TEXT default null,
    resetkey TEXT default null,
    PRIMARY key (id)
);

create index emaillookup on user (useridemail(15));

create table userrole (
  id INTEGER NOT NULL AUTO_INCREMENT,
  name TEXT,
  workspaceadmin boolean default false,
  readaccess boolean default false,
  writeaccess boolean default false,
  approver boolean default false,
  auditor boolean default false,
  PRIMARY key (id)
);

create index userroleindex on userrole (name(15));

create table workspaceaccess (
  workspaceid integer,
  userid integer,
  userroleid integer,
  FOREIGN KEY (workspaceid) REFERENCES workspace(id),
  FOREIGN KEY (userid) REFERENCES user(id),
  FOREIGN KEY (userroleid) REFERENCES userrole(id)
);

create index workspaceaccessworkidindex on workspaceaccess (workspaceid);
create index workspaceaccessuseridindex on workspaceaccess (workspaceid,userid);

create table account (
    id INTEGER NOT NULL AUTO_INCREMENT,
    parentAccountId INTEGER,
    workspaceId integer,
    accountType smallInt,
    name TEXT,
    primary key(id),
    FOREIGN KEY (parentAccountId) REFERENCES account(id),
    FOREIGN KEY (workspaceId) REFERENCES workspace(id)
);

create table tag (
  id INTEGER NOT NULL AUTO_INCREMENT,
  workspaceId integer,
  name text,
  primary key(id),
  FOREIGN KEY (workspaceId) REFERENCES workspace(id)
);

create table transaction (
   id INTEGER NOT NULL AUTO_INCREMENT,
   yearMonth integer,
   day integer,
   description text,
   ownerAccountId integer,
   referenceAccountId integer,
   ownerTransactionId integer,
   amount bigint,
   cleared boolean,
   lastUpdateUser integer,
   tagId integer,
   primary key(id),
   FOREIGN KEY (ownerAccountId) REFERENCES account(id),
   FOREIGN KEY (referenceAccountId) REFERENCES account(id),
   FOREIGN KEY (ownerTransactionID) REFERENCES transaction(id),
   FOREIGN KEY (lastUpdateUser) REFERENCES user(id),
   FOREIGN KEY (tagId) REFERENCES tag(id)
);

create index tranactionDate on transaction (yearMonth);