import os
from sklearn.datasets import fetch_lfw_people
from PIL import Image # 이미지 저장을 위해 필요 (pip install Pillow)
import numpy as np

def save_lfw_images():
    print("1. 데이터셋 다운로드 중... (시간이 좀 걸립니다)")
    # min_faces_per_person: 사진이 최소 20장 이상 있는 사람만 다운로드
    lfw_people = fetch_lfw_people(min_faces_per_person=20, resize=0.5, color=True)
    
    print(f"2. 다운로드 완료: 총 {len(lfw_people.images)}장, {len(lfw_people.target_names)}명")
    
    # 저장할 루트 폴더
    save_dir = "./lfw_dataset"
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
        
    print(f"3. '{save_dir}' 폴더에 이미지 저장 시작...")
    
    for i, (image, target) in enumerate(zip(lfw_people.images, lfw_people.target)):
        # 사람 이름 가져오기 (폴더명으로 사용)
        person_name = lfw_people.target_names[target]
        # 이름의 공백을 _로 변경 (예: Colin Powell -> Colin_Powell)
        folder_name = person_name.replace(" ", "_")
        
        # 사람별 폴더 생성
        person_dir = os.path.join(save_dir, folder_name)
        if not os.path.exists(person_dir):
            os.makedirs(person_dir)
            
        # 이미지 데이터 (0~1 실수형) -> (0~255 정수형) 변환
        if image.max() <= 1.0:
            image = (image * 255).astype(np.uint8)
        else:
            image = image.astype(np.uint8)
            
        # 이미지 저장
        img_path = os.path.join(person_dir, f"{folder_name}_{i:04d}.jpg")
        
        # PIL을 이용해 jpg로 저장
        pil_image = Image.fromarray(image)
        pil_image.save(img_path)
        
    print(f"\n✅ 저장 완료! '{save_dir}' 폴더를 대량 등록 경로로 사용하세요.")

if __name__ == "__main__":
    # 혹시 Pillow가 없으면 설치 안내
    try:
        save_lfw_images()
    except ImportError:
        print("이미지 저장을 위해 Pillow 라이브러리가 필요합니다.")
        print("pip install Pillow 명령어를 실행해주세요.")