import { Accounts } from 'meteor/accounts-base';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';

import { onError } from 'apollo-link-error';
import { ApolloLink, Observable, split } from 'apollo-link';
import { DDPSubscriptionLink, isSubscription } from 'apollo-link-ddp';


const request = async (operation) => {
    operation.setContext({
        headers: {
            // eslint-disable-next-line no-underscore-dangle
            authorization: Accounts._storedLoginToken(),
        },
    });
};

const requestLink = new ApolloLink((operation, forward) => new Observable((observer) => {
    let handle;
    Promise.resolve(operation)
        .then(oper => request(oper))
        .then(() => {
            handle = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
            });
        })
        .catch(observer.error.bind(observer));

    return () => {
        if (handle) handle.unsubscribe();
    };
}));


const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => console.log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ));
    }
    if (networkError) console.log(`[Network error]: ${networkError}`);
});

const httpLink = new HttpLink({
    uri: '/graphql',
    credentials: 'same-origin',
});


const subscriptionLink = new DDPSubscriptionLink();

const link = split(
    isSubscription,
    subscriptionLink,
    httpLink,
);


const client = new ApolloClient({
    link: ApolloLink.from([errorLink, requestLink, link]),
    cache: new InMemoryCache(),
});

export default client;
