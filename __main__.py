import pulumi
from pulumi_docker import Image, DockerBuild, Network, RemoteImage, Container

network = Network('network')

API_IMAGE = 'bust-it-app:api'
API_HOSTNAME = 'api'
API_PORT = 8000

REDIS_IMAGE = 'redis:6'
REDIS_HOSTNAME = 'redis'
REDIS_PORT = 6379

APP_IMAGE = 'bust-it-app:app'
APP_HOSTNAME = 'app'
APP_PORT = 4000

redis_image = RemoteImage(
    "redis",
    name=REDIS_IMAGE,
    keep_locally=True,
)

api_image = Image(
    "api",
    image_name=API_IMAGE,
    build=DockerBuild(
        context='./api',
        env={},
    ),
    skip_push=True,
)

app_image = Image(
    "app",
    image_name=APP_IMAGE,
    build=DockerBuild(
        context='./app',
        args={
            'SERVER_PORT': str(API_PORT)
        },
    ),
    skip_push=True,
)

redis_container = Container('redis', image=REDIS_IMAGE, networks_advanced=[{
    'name': network.name
}], ports=[{
    'internal': REDIS_PORT,
    'external': REDIS_PORT
}], hostname=REDIS_HOSTNAME)

api_container = Container('api', image=API_IMAGE, networks_advanced=[{
    'name': network.name
}], envs=[
    f'SERVER_PORT={API_PORT}',
    f'REDIS_HOST={REDIS_HOSTNAME}',
    f'REDIS_PORT={REDIS_PORT}'
], ports=[{
    'internal': API_PORT,
    'external': API_PORT
}], hostname=API_HOSTNAME, opts=pulumi.ResourceOptions(depends_on=[redis_container]))

app_container = Container('app', image=APP_IMAGE, networks_advanced=[{
    'name': network.name
}], envs=[
    f'APP_PORT={APP_PORT}',
    f'NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx'
], ports=[{
    'internal': APP_PORT,
    'external': APP_PORT
}], hostname=API_HOSTNAME, opts=pulumi.ResourceOptions(depends_on=[api_container]))
