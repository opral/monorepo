/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable camelcase */
class ApiAccess {
  requestApi = (url, params = {}, method = 'GET') => {
    let newUrl = url;
    const headersList = {
      Accept: '*/*',
      'Content-Type': 'application/json',
    };

    const options = {
      method,
      headersList,
    };
    if (method === 'GET') {
      newUrl += `?${(new URLSearchParams(params)).toString()}`;
    } else if (method === 'DELETE') {
      newUrl += `/${params.item_id}`;
    }

    return fetch(newUrl, options);
  };

  getApi = async (url, params, callback) => {
    const response = await this.requestApi(url, params, 'GET');
    if (response.ok) {
      if (callback !== undefined) {
        callback();
      }
      return response.json();
    }
    return '';
  };

  postApi = async (url, params = {}) => {
    const headersList = {
      Accept: '*/*',
      'Content-Type': 'application/json',
    };

    const body = params;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: headersList,
    });
    return response;
  }

  deleteApi = async (url, params) => {
    const response = await this.requestApi(url, params, 'DELETE');
    return response;
  }
}

const access = new ApiAccess();
export { access, ApiAccess };
