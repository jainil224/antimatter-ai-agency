import CameraControls from '@components/3d/CameraControls'

export const SceneSetup = ({ showGrid = true, cameraRef }: { showGrid?: boolean; cameraRef?: any }) => {
    return (
        <>
            <CameraControls ref={cameraRef} />
            {showGrid && <gridHelper args={[50, 50, '#004444', '#002222']} position={[0, -1, 0]} />}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} />
        </>
    )
}
