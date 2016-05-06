from fabric.api import *
from fabric.contrib.files import *
from fabric.contrib.project import rsync_project
from subprocess import check_output

def deploy():
    # Skip node modules. 300M of crap
    local('tar\
        -cf\
        /tmp/stranded.tar.gz\
        *'
    )
    put('/tmp/stranded.tar.gz', '/tmp/stranded.tar.gz')
    deploy_path = '/home/stranded/the-stranded'
    run('rm -rf {}'.format(deploy_path))
    run('mkdir {}'.format(deploy_path))
    run('tar xf /tmp/stranded.tar.gz -C {}'.format(deploy_path))
    run('sudo chown -R stranded:stranded {}'.format(deploy_path))
    run('sudo chmod -R 777 {}'.format(deploy_path))

    run('sudo cp {}/stranded.conf /etc/init/stranded.conf'.format(deploy_path))
    run('sudo service stranded restart')
    run('rm /tmp/stranded.tar.gz')

def production():
    env.user = 'root'
    env.hosts = ['thestranded.net']

