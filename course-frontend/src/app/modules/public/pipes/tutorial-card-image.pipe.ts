import { Pipe, PipeTransform } from '@angular/core';
import { getTutorialCardImageUrl } from 'src/app/utils/course-card-media';

@Pipe({ name: 'tutorialCardImage', pure: true })
export class TutorialCardImagePipe implements PipeTransform {
  transform(course: any): string | null {
    return getTutorialCardImageUrl(course);
  }
}
