#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>
#define PI 3.14158265

int main() {
	int col,lig,k,i;
	float aleat;
	float x, ret, val;
	srand(time(NULL));
	FILE* fichier = NULL;
	fichier = fopen("randval.csv","w");
	if (fichier != NULL) {
		printf("Columns ? : ");
		scanf("%d",&col);
		printf("Lines ? : ");
		scanf("%d",&lig);
		val = PI / 180;
		for (k=0;k<lig;k++) 
		{
			x=0;
			for(i=0;i<col;i++) 
			{
				aleat =rand()%(100-0) -50; //define a random value between  and 0.5
				printf("%f\t",aleat/200);
				ret = sin(x*val)+aleat/200; //set a random value who follows sin function
				x+=1; //add 1°
				fprintf(fichier,"%f",ret);
				//printf("%f",ret);
				if(i!=col-1)
				{
					fprintf(fichier,";");
					printf("\n");
				}
			}
			fprintf(fichier,"\n");
			printf("%d",aleat);
		}		
	}
	else {
		printf("Can't open file");
		fclose(fichier);
	}
		
	return 0;
}