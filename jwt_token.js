import * as jwt from 'atlassian-jwt';
import moment from 'moment';

const now = moment().utc();

export function GenerateToken(request_method, bdata, request_url, secret) {
    const req = jwt.fromMethodAndUrl(request_method, request_url);

    const tokenData = {
        "iss": "trainspottinjas",
        "iat": now.unix(),                    // The time the token is generated
        "exp": now.add(3, 'minutes').unix(),  // Token expiry time (recommend 3 minutes after issuing)
        "qsh": jwt.createQueryStringHash(req) // [Query String Hash](https://developer.atlassian.com/cloud/jira/platform/understanding-jwt/#a-name-qsh-a-creating-a-query-string-hash)
    };

    const token = jwt.encode(tokenData, secret);
    return token;
}