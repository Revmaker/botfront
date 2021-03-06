/* eslint-disable import/order */
import { Projects } from '../api/project/project.collection';
import React from 'react';

let canExport = () => true;
let checkIfCanExport = () => {};
let getScopesForUserExport = () => {
    const projects = Projects.find({}, { fields: {} }).fetch();
    return projects.map(project => project._id);
};
let areScopeReadyExport = () => true;
let setScopesExport = () => {};
let CanExport = props => (
    <>
        {props.children}
    </>
);


export const getScopesForUser = getScopesForUserExport;
export const can = canExport;
export const checkIfCan = checkIfCanExport;
export const areScopeReady = areScopeReadyExport;
export const setScopes = setScopesExport;
export const Can = CanExport;
