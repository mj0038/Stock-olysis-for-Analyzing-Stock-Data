import { GET_FILE_COLUMNS, GET_FILE_COLUMNS_ERROR, GET_FILE_COLUMNS_SUCCESS, SEARCH, SEARCH_SUCCESS, SEARCH_ERROR, RESET_SEARCH, GET_ANALYTICS, GET_ANALYTICS_SUCCESS, GET_ANALYTICS_ERROR } from './constants';

export function getFileColumns(db, inode) {
  return {
    type: GET_FILE_COLUMNS,
    inode,
    db
  };
}

export function getFileColumnsSuccess(result) {
  return {
    type: GET_FILE_COLUMNS_SUCCESS,
    result
  };
}

export function getFileColumnsError(error) {
  return {
    type: GET_FILE_COLUMNS_ERROR,
    error
  };
}

export function search(params) {
  return {
    type: SEARCH,
    ...params
  };
}

export function searchSuccess(result) {
  return {
    type: SEARCH_SUCCESS,
    result
  };
}

export function searchError(error) {
  return {
    type: SEARCH_ERROR,
    error
  };
}

export function resetSearch() {
  return {
    type: RESET_SEARCH
  };
}

export function getAnalytics(params) {
  return {
    type: GET_ANALYTICS,
    ...params
  };
}

export function getAnalyticsSuccess(result) {
  return {
    type: GET_ANALYTICS_SUCCESS,
    result
  };
}

export function getAnalyticsError(error) {
  return {
    type: GET_ANALYTICS_ERROR,
    error
  };
}
