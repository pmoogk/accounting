
use accounting;

insert into workspace (name, description) values ('rootworkspace', 'Root workspace');
insert into config values (json_object('rootworkspaceid', LAST_INSERT_ID() ));
insert into user (firstname, lastname, useridemail, lastaccessdate, accesstoken, accesskey)
            values ('Peter', 'Moogk', 'peter@test.com', now(), null, null ),
                   ('Org', 'Admin', 'orgadmin@test.com', now(), null, null);

insert into userrole (name, workspaceadmin, readaccess, writeaccess, approver, auditor)
            values ('Workspace admin', true, false, false, false, false),
                   ('Treasurer', false, true, true, false, false),
                   ('Approver', false, true, false, true, false),
                   ('Lead auditor', false, true, false, false, true),
                   ('Auditor', false, true, false, false, false),
                   ('None', false, false, false, false, false);

insert into workspaceaccess (workspaceid, userid, userroleid)
            values (1,1,1);

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

insert into transaction (yearMonth, day, description, ownerAccountId, referenceAccountId,
                         ownerTransactionId, amount,
                         cleared, lastUpdateUser) values 
                         ( 202107, 1, "Main trans", 7, null, null, 100000, false, 1);

insert into transaction (yearMonth, day, description, ownerAccountId, referenceAccountId,
                         ownerTransactionId, amount,
                         cleared, lastUpdateUser) values 
                         ( 202107, 1, "Ref1", 7, 9, last_insert_id(), 90000, false, 1),
                         ( 202107, 1, "Ref2", 7, 8, last_insert_id(), -10000, false, 1);