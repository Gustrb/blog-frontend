const app = angular.module('Blog', ['ngRoute']);

app.config(['$routeProvider', function config($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'pages/home.html'
    }).
    when('/tags', {
        templateUrl: 'pages/tags/index.html'
    }).
    when('/posts', {
        templateUrl: 'pages/post/posts.html'
    }).
    when('/posts/search/:title', {
        templateUrl: 'pages/post/search.html'
    }).
    when('/posts/:postId', {
        templateUrl: 'pages/post/post.html'
    }).
    when('/posts/:postId/delete', {}).
    when('/posts/:postId/update', {
        templateUrl: 'pages/post/update.html'
    }).
    when('/register', {
        templateUrl: 'pages/user/register.html'
    }).
    when('/users/:userId/update', {
        templateUrl: 'pages/user/update.html'
    });
}]);

app.controller('ApplicationController', ['$scope', function ($scope) {
    $scope.getLoggedUser = () => {
        return JSON.parse(localStorage.getItem('user')).user;
    };

    $scope.isAnyLoggedUser = () => {
        return !!localStorage.getItem('user');
    };
}]);

app.controller('PostsController', ['$scope', '$routeParams', 'postService', 'tagService', 'commentService', 'userService', '$location', function ($scope, $routeParams, postService, tagService, commentService, userService, $location) {
    $scope.posts = [];

    if(!$routeParams.title) {
        postService.fetchAll().then(res => {
            res.posts.forEach(post => {
                commentService.fetchAll(post.id).then(response => {
                    post.comments = response.comments;
                    $scope.posts.push(post);
                });
            });
        });
    }

    $scope.singlePost = {};

    const fetchResponse = postService.fetchOne($routeParams.postId);

    if (fetchResponse) {
        fetchResponse.then(res => {
            $scope.singlePost = res;
            $scope.singlePost.id = $routeParams.postId;
        });
    }

    $scope.post = {};

    $scope.getLoggedUser = function () {
        return userService.getLoggedUser();
    };

    $scope.isAnyLoggedUser = function () {
        return userService.isAnyLoggedUser();
    }

    $scope.createPostData = {};

    $scope.tags = [];

    tagService.fetchAll().then(res => {
        $scope.tags = res;
    });

    $scope.createPost = function () {
        const token = userService.getCurrentUserToken();

        postService.createPost($scope.createPostData, token).then(res => {
            for (const id of $scope.tagsToLink) {
                postService.linkTag(res.id, id, token).then();
            }

            location.reload();
        });
    };

    $scope.postToUpdate = {};

    $scope.updatePost = function () {
        const token = userService.getCurrentUserToken();

        $scope.postToUpdate.id = $routeParams.postId;

        postService.updatePost($scope.postToUpdate, token).then(res => {
            for (const id of $scope.tagsToLink) {
                postService.linkTag(res.id, id, token).then();
            }
            $location.url('/posts');
        });
    };

    $scope.deletePost = function () {
        const token = userService.getCurrentUserToken();

        postService.deletePost($routeParams.postId, token).then(res => {
            $location.url('/posts');
        });
    };

    $scope.tagsToLink = [];

    $scope.addTag = function (event, tag_id) {
        const target = event.target;

        if (!$scope.tagsToLink.includes(tag_id)) {
            $scope.tagsToLink.push(tag_id);

            if (target.classList.contains('badge-secondary')) {
                target.classList.remove('badge-secondary');
                target.classList.add('badge-danger');
            }
        } else {
            const index = $scope.tagsToLink.indexOf(tag_id);
            $scope.tagsToLink.splice(index);

            target.classList.remove('badge-danger');
            target.classList.add('badge-secondary');
        }
    };

    $scope.unlinkTag = function (tag_id, post_id) {
        const token = userService.getCurrentUserToken();

        postService.unlinkTag(post_id, tag_id, token).then(res => {
            location.reload();
        });
    };

    $scope.comment = {};

    const findPostById = (id) => {
        return $scope.posts.find(post => {
            return post.id === id;
        });
    };

    $scope.createComment = function (post_id) {
        const token = userService.getCurrentUserToken();

        commentService.createComment(findPostById(post_id).newComment, post_id, token).then(res => {
            location.reload();
        });
    };

    $scope.deleteComment = function (post_id, comment_id) {
        const token = userService.getCurrentUserToken();

        commentService.deleteComment(comment_id, post_id, token).then(res => {
            location.reload();
        });
    };

    $scope.query = "";
    $scope.posts = [];

    $scope.search = function() {
        $('.search-input').val('');
        $location.url(`/posts/search/${$scope.query}`);
    };

    if($routeParams.title) {
        postService.search($routeParams.title).then(res => {
            res.posts.forEach(post => {
                commentService.fetchAll(post.id).then(response => {
                    post.comments = response.comments;
                    $scope.posts.push(post);
                });
            });
        });
    }
}]);

app.controller('TagsController', ['$scope', 'tagService', 'userService', function ($scope, tagService, userService) {
    $scope.newTag = {};

    $scope.getLoggedUser = function () {
        return userService.getLoggedUser();
    };

    $scope.createTag = function () {
        const token = userService.getCurrentUserToken();

        tagService.createTag($scope.newTag, token).then(res => {
            location.reload();
        });
    };

    $scope.tags = [];

    tagService.fetchAll().then(res => $scope.tags = res);
}]);

app.controller('UsersController', ['$scope', '$routeParams', 'userService', function ($scope, $routeParams, userService) {
    $scope.userRegister = {};
    $scope.registerErrors = [];

    $scope.isAnyLoggedUser = function () {
        return userService.isAnyLoggedUser();
    };

    $scope.getLoggedUser = function () {
        return userService.getLoggedUser();
    };

    $scope.register = function () {
        if ($scope.userRegister.password !== $scope.userRegister.passwordConfirmation) {
            $scope.registerErrors.push("Senhas não são iguais");
            
            alert('As senhas não coincidem');
            location.reload();
            return;
        }

        userService.createUser($scope.userRegister).then(res => {
            if (res.error) {
                $scope.registerErrors.push(res.error);
                return;
            }

            location.href = "http://localhost/scopi-front-end/#/";
        });
    };

    $scope.userLogin = {};
    $scope.errorMessages = [];

    $scope.login = function () {
        userService.login($scope.userLogin).then(res => {
            if (res.error) {
                $scope.errorMessages.push(res.error);
                return;
            }

            localStorage.setItem('user', JSON.stringify(res));
            location.href = "http://localhost/scopi-front-end/#/posts";
        });
    };

    $scope.logoff = function () {
        localStorage.removeItem('user');
        location.href = "http://localhost/scopi-front-end/#/";
    };

    $scope.userToUpdate = {};

    $scope.updateUser = function () {
        const token = userService.getCurrentUserToken();

        userService.updateUser($scope.userToUpdate, $routeParams.userId, token).then(res => {
            localStorage.setItem('user', JSON.stringify({
                user: res,
                token: token
            }));

            window.location.href = "http://localhost/scopi-front-end/#/";
        });
    };

    $scope.deleteUser = function () {
        const id = userService.getLoggedUser().id;
        const token = userService.getCurrentUserToken();

        userService.deleteUser(id, token).then(res => {
            localStorage.removeItem('user');
            location.href = 'http://localhost/scopi-front-end/#/register';
        });
    };
}]);

app.service('postService', function ($http) {
    const fetchAll = () => $http.get('http://localhost:3000/posts.json').then(res => res.data);
    const fetchOne = id => {
        if (!id)
            return;

        return $http.get(`http://localhost:3000/posts/${id}.json`).then(res => res.data);
    };

    const createPost = (post, token) => {
        return $http({
            method: 'POST',
            url: 'http://localhost:3000/posts',
            data: {
                post: {
                    title: post.title,
                    description: post.description
                }
            },
            headers: {
                Authorization: token
            }
        }).then(res => res.data);
    };

    const deletePost = (id, token) => {
        return $http({
                method: 'DELETE',
                url: `http://localhost:3000/posts/${id}`,
                headers: {
                    Authorization: token
                }
            })
            .then(res => res.data);
    };

    const updatePost = (post, token) => {
        return $http({
                method: 'PUT',
                url: `http://localhost:3000/posts/${post.id}`,
                data: {
                    post: {
                        title: post.title,
                        description: post.description
                    }
                },
                headers: {
                    Authorization: token
                }
            })
            .then(res => res.data);
    };

    const linkTag = (post_id, tag_id, token) => {
        return $http({
            method: 'POST',
            url: `http://localhost:3000/posts/${post_id}/tags`,
            data: {
                post: {
                    tag_id
                }
            },
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            }
        }).then(res => res.data);
    };

    const unlinkTag = (post_id, tag_id, token) => {
        return $http({
            method: 'DELETE',
            url: `http://localhost:3000/posts/${post_id}/tags`,
            data: {
                post: {
                    "tag_id": tag_id
                }
            },
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            }
        }).then(res => res.data);
    };

    const search = title => {
        if(!title) return;

        return $http({
            method: 'GET',
            url: `http://localhost:3000/posts/search/${title}.json`,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.data);
    };

    return {
        fetchAll,
        fetchOne,
        createPost,
        deletePost,
        updatePost,
        linkTag,
        unlinkTag,
        search,
    };
});

app.service('commentService', function ($http) {
    const fetchAll = post_id => {
        return $http({
            method: 'GET',
            url: `http://localhost:3000/posts/${post_id}/comments.json`
        }).then(res => res.data);
    };

    const createComment = ({
        text
    }, post_id, token) => {
        return $http({
            method: 'POST',
            url: `http://localhost:3000/posts/${post_id}/comments.json`,
            data: {
                comment: {
                    text
                }
            },
            headers: {
                Authorization: token
            }
        }).then(res => res.data);
    };

    const deleteComment = (comment_id, post_id, token) => {
        return $http({
            method: 'DELETE',
            url: `http://localhost:3000/posts/${post_id}/comments/${comment_id}`,
            headers: {
                Authorization: token
            }
        }).then(res => res.data);
    };

    return {
        fetchAll,
        createComment,
        deleteComment,
    };
});

app.service('tagService', function ($http) {
    const fetchAll = () => {
        return $http({
            method: 'GET',
            url: 'http://localhost:3000/tags'
        }).then(response => response.data);
    };

    const createTag = ({
        name
    }, token) => {
        return $http({
            method: 'POST',
            url: 'http://localhost:3000/tags',
            data: {
                tag: {
                    name
                }
            },
            headers: {
                Authorization: token
            }
        }).then(res => res.data);
    };

    return {
        fetchAll,
        createTag,
    };
});

app.service('userService', function ($http) {
    const login = ({
        email,
        password
    }) => {
        return $http({
            method: 'POST',
            url: 'http://localhost:3000/login',
            data: {
                user: {
                    email,
                    password
                }
            }
        }).then(res => res.data);
    };

    const createUser = ({
        name,
        email,
        password
    }) => {
        return $http({
            method: 'POST',
            url: 'http://localhost:3000/users',
            data: {
                user: {
                    name,
                    email,
                    password
                }
            }
        }).then(res => res.data);
    };

    const updateUser = ({
        name,
        email,
        password
    }, id, token) => {
        return $http({
            method: 'PUT',
            url: `http://localhost:3000/users/${id}.json`,
            data: {
                user: {
                    name,
                    email,
                    password
                }
            },
            headers: {
                Authorization: token
            }
        }).then(res => res.data);
    };

    const deleteUser = (id, token) => {
        return $http({
            method: 'DELETE',
            url: `http://localhost:3000/users/${id}.json`,
            headers: {
                Authorization: token
            }
        }).then(res => res.data);
    };

    const getLoggedUser = () => JSON.parse(localStorage.getItem('user')).user;

    const isAnyLoggedUser = () => !!localStorage.getItem('user');

    const getCurrentUserToken = () => JSON.parse(localStorage.getItem('user')).token;

    return {
        login,
        createUser,
        updateUser,
        deleteUser,
        getLoggedUser,
        isAnyLoggedUser,
        getCurrentUserToken,
    };
});