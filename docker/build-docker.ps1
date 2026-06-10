# Docker 构建和部署脚本
param(
    [switch]$Build,
    [switch]$Run,
    [switch]$Stop,
    [switch]$Clean
)

$IMAGE_NAME = "yibei-toolbox"
$CONTAINER_NAME = "toolbox-container"

function Build-Image {
    Write-Host "构建 Docker 镜像..." -ForegroundColor Green
    docker build -t $IMAGE_NAME .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "镜像构建成功!" -ForegroundColor Green
    } else {
        Write-Host "镜像构建失败!" -ForegroundColor Red
        exit 1
    }
}

function Run-Container {
    Write-Host "启动容器..." -ForegroundColor Green
    docker run -d --name $CONTAINER_NAME -p 8080:80 $IMAGE_NAME
    if ($LASTEXITCODE -eq 0) {
        Write-Host "容器启动成功!" -ForegroundColor Green
        Write-Host "访问地址: http://localhost:8080" -ForegroundColor Cyan
    } else {
        Write-Host "容器启动失败!" -ForegroundColor Red
    }
}

function Stop-Container {
    Write-Host "停止容器..." -ForegroundColor Yellow
    docker stop $CONTAINER_NAME 2>$null
    docker rm $CONTAINER_NAME 2>$null
    Write-Host "容器已停止并移除" -ForegroundColor Yellow
}

function Clean-All {
    Write-Host "清理所有资源..." -ForegroundColor Red
    Stop-Container
    docker rmi $IMAGE_NAME 2>$null
    Write-Host "清理完成" -ForegroundColor Red
}

# 主逻辑
if ($Build) {
    Build-Image
} elseif ($Run) {
    Run-Container
} elseif ($Stop) {
    Stop-Container
} elseif ($Clean) {
    Clean-All
} else {
    # 默认构建并运行
    Build-Image
    Run-Container
}