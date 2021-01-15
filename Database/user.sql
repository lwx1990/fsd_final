drop database if exists sm2020;

create database sm2020;

use sm2020;

create table user (
	user_id varchar(64) not null,
	password varchar(64) not null,
	firstname varchar(64) not null,
	lastname varchar(64) not null,
	email varchar(64) not null,
	primary key(user_id)
);

