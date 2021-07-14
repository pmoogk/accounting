drop database accounting;
create database accounting;
use accounting;
create table workspace ( 
     id INTEGER NOT NULL AUTO_INCREMENT,
     name TEXT NOT NULL,
     description TEXT,
     PRIMARY KEY (id)
);

create table user (
    id INTEGER NOT NULL AUTO_INCREMENT,
    firstname TEXT,
    lastname TEXT,
    userid TEXT,
    passwrd TEXT default null,
    lastaccessdate datetime default null,
    accesstoken INTEGER default 0,
    accesskey TEXT default null,
    resetkey TEXT default null,
    PRIMARY key (id)
);

create index emaillookup on user (userid(15));

create table userrole (
  id INTEGER NOT NULL AUTO_INCREMENT,
  name TEXT,
  orgadmin boolean default false,
  workspaceadmin boolean default false,
  writeaccess boolean default false,
  approver boolean default false,
  auditor boolean default false,
  PRIMARY key (id)
);

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

insert into workspace (name, description) values ('rootworkspace', 'Root workspace');
insert into user (firstname, lastname, userid, lastaccessdate, accesstoken, accesskey)
            values ('Peter', 'Moogk', 'peter@test.com', now(), null, null );

insert into userrole (name, orgadmin, workspaceadmin, writeaccess, approver, auditor)
            values ('Organization admin', true, true, true, true, true),
                   ('Workspace admin', false, true, false, false, false),
                   ('Treasurer', false, false, true, false, false),
                   ('Approver', false, false, false, true, false),
                   ('Lead auditor', false, false, false, false, true),
                   ('Auditor', false, false, false, false, false);

insert into account (workspaceId, parentAccountId, name, accountType) values 
                    (null, null, 'Fixed assets', 1), 
                    (null, null, 'Liquid assets', 1),
                    (null, null, 'Liabilities', 2),
                    (null, null, 'Revenue', 3),
                    (null, null, 'Expenses', 4);

insert into account (workspaceId, parentAccountId, name, accountType) values 
                    (1, 1, 'Building', 1), 
                    (1, 2, 'Checking', 1),
                    (1, 3, 'HST collected', 2),
                    (1, 4, 'Rent', 3),
                    (1, 4, 'Event revenue', 3),
                    (1, 5, 'Event expenses', 4);

insert into transaction (yearMonth, day, ownerAccountId, referenceAccountId,
                         ownerTransactionId, amount,
                         cleared, lastUpdateUser) values 
                         ( 202107, 1, 7, null, null, 100000, false, 1);

insert into transaction (yearMonth, day, ownerAccountId, referenceAccountId,
                         ownerTransactionId, amount,
                         cleared, lastUpdateUser) values 
                         ( 202107, 1, 7, 9, last_insert_id(), 90000, false, 1),
                         ( 202107, 1, 7, 8, last_insert_id(), -10000, false, 1);