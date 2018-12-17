from PIL import Image
import os

for subdir, dirs, files in os.walk("images"):
    for file in files:
    	if file.endswith(".jpg") == False:
    		continue
    	location = os.path.join(subdir, file)
    	image = Image.open(location)
    	location = location.replace("images", "images_reduced").replace(".jpg", ".jpeg")
    	if os.path.isfile(location):
    		continue
    	print(location)
    	if "exif" in image.info:
    		image.save(location, "jpeg", exif=image.info['exif'])
    	else:
    		image.save(location, "jpeg")

# foo = foo.resize((160,300),Image.ANTIALIAS)