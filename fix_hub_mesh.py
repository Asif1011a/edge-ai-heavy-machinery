import os

file_path = "c:\\Users\\zamza\\Downloads\\tata\\src\\components\\MachineMesh.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

broken = """  return (
      </mesh>"""

fixed = """  return (
    <group>
      {/* SERVER RACK COLUMNS (3 full racks) */}
      {[-1.25,0,1.25].map((x,ri)=>(
        <group key={ri} position={[x,0,0]}>
          <Box pos={[0,1.05,0]}  size={[0.88,2.1,1.05]} mat={rackMat} />
          <Box pos={[0,2.12,0]}  size={[0.9,0.08,1.07]}  mat={M.darkMet()} />
          <Box pos={[0,1.05,0.53]} size={[0.9,2.12,0.04]} mat={M.panel()} />
          {[[-0.38,-0.48],[0.38,-0.48],[-0.38,0.48],[0.38,0.48]].map(([fx,fz],i)=>(
            <Box key={i} pos={[fx,0.03,fz]} size={[0.08,0.06,0.08]} mat={M.darkMet()} />
          ))}
          {Array.from({length:10},(_,i)=>(
            <group key={i} position={[0,0.22+i*0.18,0.53]}>
              <Box pos={[0,0,0]} size={[0.78,0.14,0.03]} mat={{...unitMat,emissiveIntensity:0.15+(i%3)*0.12}} />
              {[-0.22,-0.08,0.06].map((dx,j)=>(
                <Box key={j} pos={[dx,0,0.02]} size={[0.1,0.09,0.01]} mat={M.darkMet()} />
              ))}
              {[0,1,2].map(j=>(
                <Sph key={j} pos={[0.27+j*0.055,0,0.028]} r={0.013} seg={6}
                  mat={{color:['#22c55e','#3b82f6','#f59e0b'][j],emissive:['#22c55e','#3b82f6','#f59e0b'][j],emissiveIntensity:0.9}} />
              ))}
              <Sph pos={[0.34,0,0.028]} r={0.01} seg={6} mat={{color:'#4ade80',emissive:'#4ade80',emissiveIntensity:0.8}} />
            </group>
          ))}
          <Box pos={[0,2.08,0.53]}   size={[0.78,0.12,0.03]} mat={M.metal('#0a1830',0.75,0.4)} />
          {Array.from({length:10},(_,p)=>(
            <Box key={p} pos={[-0.32+p*0.072,2.08,0.555]} size={[0.05,0.05,0.014]}
              mat={{color:'#1d4a7a',emissive:'#1d4ed8',emissiveIntensity:0.4,metalness:0.6}} />
          ))}
          <Box pos={[0,0.12,0.53]}   size={[0.78,0.14,0.03]} mat={M.metal('#091422',0.8,0.3)} />
          <Box pos={[-0.2,0.12,0.56]} size={[0.32,0.08,0.015]} mat={{color:'#1a3a60',emissive:'#1d4ed8',emissiveIntensity:0.35}} />
        </group>
      ))}

      {/* CABLE MANAGEMENT OVERHEAD TRAY */}
      <Box pos={[0,2.22,-0.12]} size={[3.55,0.055,0.38]} mat={M.darkMet()} />
      {[-1.0,0,1.0].map((x,i)=>(
        <Cyl key={i} pos={[x,2.17,-0.05]} args={[0.018,0.018,0.22,6]}
          mat={{color:['#1d4ed8','#7c3aed','#0f766e'][i],roughness:0.85}} />
      ))}
      {[-0.9,-0.3,0.3,0.9].map((x,i)=>(
        <Cyl key={i} pos={[x,2.2,-0.12]} rot={[0,0,Math.PI/2]} args={[0.014,0.014,0.42,6]}
          mat={{color:'#0f1a28',roughness:0.9}} />
      ))}

      {/* HOLOGRAPHIC DISPLAY DOME */}
      <Cyl pos={[0,2.38,-0.25]} args={[0.58,0.68,0.14,24]} mat={M.darkMet('#060c18')} />
      <Ring pos={[0,2.46,-0.25]} rot={[Math.PI/2,0,0]} args={[0.62,0.025,8,40]}
        mat={{color:'#3b82f6',emissive:'#3b82f6',emissiveIntensity:0.8}} />

      {/* Orbital rings */}
      <mesh ref={ring1} position={[0,3.2,-0.25]}>
        <torusGeometry args={[1.18,0.034,10,58]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.0} />
      </mesh>
      <mesh ref={ring2} position={[0,3.2,-0.25]}>
        <torusGeometry args={[0.88,0.026,10,58]} />
        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={ring3} position={[0,3.2,-0.25]}>
        <torusGeometry args={[0.62,0.02,10,58]} />
        <meshStandardMaterial color="#93c5fd" emissive="#93c5fd" emissiveIntensity={0.8} />
      </mesh>"""

if broken in content:
    content = content.replace(broken, fixed)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed HubMesh.")
else:
    print("Broken HubMesh string not found.")
