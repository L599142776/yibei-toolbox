#!/bin/bash

IMAGE_NAME="yibei-toolbox"
CONTAINER_NAME="toolbox-container"

build_image() {
    echo "构建 Docker 镜像..."
    docker build -t $IMAGE_NAME .
    if [ $? -eq 0 ]; then
        echo "镜像构建成功!"
    else
        echo "镜像构建失败!"
        exit 1
    fi
}

run_container() {
    echo "启动容器..."
    docker run -d --name $CONTAINER_NAME -p 8080:80 $IMAGE_NAME
    if [ $? -eq 0 ]; then
        echo "容器启动成功!"
        echo "访问地址: http://localhost:8080"
    else
        echo "容器启动失败!"
    fi
}

stop_container() {
    echo "停止容器..."
    docker stop $CONTAINER_NAME 2>/dev/null
    docker rm $CONTAINER_NAME 2>/dev/null
    echo "容器已停止并移除"
}

clean_all() {
    echo "清理所有资源..."
    stop_container
    docker rmi $IMAGE_NAME 2>/dev/null
    echo "清理完成"
}

# 主逻辑
case "$1" in
    build)
        build_image
        ;;
    run)
        run_container
        ;;
    stop)
        stop_container
        ;;
    clean)
        clean_all
        ;;
    *)
        # 默认构建并运行
        build_image
        run_container
        ;;
esac