/**
 * Homepage selectors
 */

import { createSelector } from 'reselect';
import { initialState } from './reducer';

const makeSelectCat = state => state.cat || initialState;

const makeSelectFile = () =>
  createSelector(
    makeSelectCat,
    catState => catState,
  );

const makeSelectPartitionsList = () =>
  createSelector(
    makeSelectCat,
    partitionsState => partitionsState.partitions,
  );

export { makeSelectFile, makeSelectPartitionsList };